from django.db import models

from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.logic import new_sctp_client
from sctp.types import ScAddr, SctpIteratorType, ScElementType

from django.db.backends.dummy.base import DatabaseError

# Create your models here.
__all__ = (
    'SesionScAddr',
    'UserScAddr',
)

class SessionScAddr(models.Model):
    
    session_key = models.CharField(max_length = 64, unique=True)
    sc_addr = models.CharField(max_length = 30)
    
    @staticmethod
    def add_session(session_key):
        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        
        keynode_ui_user = keys[KeynodeSysIdentifiers.ui_user]
        
        user_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
        sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)
       
        item = SessionScAddr(session_key = session_key, sc_addr = user_node.to_id())
        item.save()
        
        return user_node
    
            
    @staticmethod
    def get_session_addr(session_key):
        obj = None
        try:
            obj = SessionScAddr.objects.get(session_key = session_key)
        except DatabaseError as error:
            print 'Database error: ', error
        except KeyError as error:
            print 'Key error: ', error
        except:
            print 'Unknown error'
        
        if obj:
            return ScAddr.parse_from_string(obj.sc_addr)
        
        return None

# ------------------------------------------
class UserScAddr(models.Model):
    
    username = models.CharField(max_length = 64, unique=True)
    sc_addr = models.CharField(max_length = 30)
    
    @staticmethod
    def add_user(username):
        
        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        keynode_ui_user_registered = keys[KeynodeSysIdentifiers.ui_user_registered]
        
        user_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
        sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user_registered, user_node)
        
        obj = UserScAddr(username = username, sc_addr = user_node.to_id())
        obj.save()
        
        return user_node

    @staticmethod
    def get_user_addr(username):
        obj = None
        try:
            obj = UserScAddr.objects.get(username = username)
        except DatabaseError as error:
            print 'Database error: ', error
        except KeyError as error:
            print 'Key error: ', error
        except:
            print 'Unknown error'
        
        if obj:
            return ScAddr.parse_from_string(obj.sc_addr)
        
        return UserScAddr.add_user(username)
