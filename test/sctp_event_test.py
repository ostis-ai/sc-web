import time
from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.client import SctpClient
from sctp.types import ScAddr, SctpIteratorType, ScElementType, ScEventType

v = 1
max_v = 5

def callback(event_id, addr, arc):
    print "Event id: %d, %s, %s" % (event_id, str(addr), str(arc))
    print "%d of %d" % (v, max_v)
    global v, max_v
    
    v += 1

sctp_client = SctpClient()
sctp_client.initialize('localhost', 55770)

addr = sctp_client.find_element_by_system_identifier('question_initiated')
addr2 = sctp_client.find_element_by_system_identifier('question_initiated')
event_id = sctp_client.event_create(ScEventType.SC_EVENT_ADD_OUTPUT_ARC, addr, callback)

print "Event id: %d" % event_id

while v <= 5:
    time.sleep(1)    

print "Shutdown"
sctp_client.shutdown()
