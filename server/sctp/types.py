# -*- coding: utf-8 -*-
"""
-----------------------------------------------------------------------------
This source file is part of OSTIS (Open Semantic Technology for Intelligent Systems)
For the latest info, see http://www.ostis.net

Copyright (c) 2012 OSTIS

OSTIS is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

OSTIS is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with OSTIS. If not, see <http://www.gnu.org/licenses/>.
-----------------------------------------------------------------------------
"""
import struct

__all__ = (
    'SctpCommandType',
    'SctpResultCode',
    'SctpIteratorType',
    'ScElementType',
    'ScAddr',
    'ScStatItem',
)


class SctpCommandType:
    SCTP_CMD_UNKNOWN            = 0x00 # unkown command
    SCTP_CMD_CHECK_ELEMENT      = 0x01 # check if specified sc-element exist
    SCTP_CMD_GET_ELEMENT_TYPE   = 0x02 # return sc-element type
    SCTP_CMD_ERASE_ELEMENT      = 0x03 # erase specified sc-element
    SCTP_CMD_CREATE_NODE        = 0x04 # create new sc-node
    SCTP_CMD_CREATE_LINK        = 0x05 # create new sc-link
    SCTP_CMD_CREATE_ARC         = 0x06 # create new sc-arc
    SCTP_CMD_GET_ARC            = 0x07 # return begin and end element of sc-arc
    
    SCTP_CMD_GET_LINK_CONTENT   = 0x09 # return content of sc-link
    SCTP_CMD_FIND_LINKS         = 0x0a # return sc-links with specified content
    SCTP_CMD_SET_LINK_CONTENT   = 0x0b # setup new content for the link
    
    SCTP_CMD_ITERATE_ELEMENTS   = 0x0c # return base template iteration result
    SCTP_CMD_ITERATE_CONSTRUCTION = 0x0d # return advanced template iteration results
    
    SCTP_CMD_EVENT_CREATE       = 0x0e # create subscription to specified event
    SCTP_CMD_EVENT_DESTROY      = 0x0f # destroys specified event subscription
    SCTP_CMD_EVENT_EMIT         = 0x10 # emits specified event to client


    SCTP_CMD_FIND_ELEMENT_BY_SYSITDF = 0xa0 # return sc-element by it system identifier
    SCTP_CMD_SET_SYSIDTF        = 0xa1   # setup new system identifier for sc-element
    SCTP_CMD_STATISTICS         = 0xa2 # return usage statistics from server


class SctpResultCode:
    SCTP_RESULT_OK              = 0x00 #
    SCTP_RESULT_FAIL            = 0x01 #
    SCTP_RESULT_ERROR_NO_ELEMENT= 0x02 # sc-element wasn't founded
    SCTP_RESULT_NORIGHTS        = 0x03


class SctpIteratorType:
    SCTP_ITERATOR_3F_A_A = 0
    SCTP_ITERATOR_3A_A_F = 1
    SCTP_ITERATOR_3F_A_F = 2
    SCTP_ITERATOR_5F_A_A_A_F = 3    # TODO: fix name
    SCTP_ITERATOR_5_A_A_F_A_F = 4
    SCTP_ITERATOR_5_F_A_F_A_F = 5
    SCTP_ITERATOR_5_F_A_F_A_A = 6
    SCTP_ITERATOR_5_F_A_A_A_A = 7
    SCTP_ITERATOR_5_A_A_F_A_A = 8


class ScElementType:
    # sc-element types
    sc_type_node        =   0x1
    sc_type_link        =   0x2
    sc_type_edge_common =   0x4
    sc_type_arc_common  =   0x8
    sc_type_arc_access  =   0x10

    # sc-element constant
    sc_type_const       =   0x20
    sc_type_var         =   0x40

    # sc-element positivity
    sc_type_arc_pos     =   0x80
    sc_type_arc_neg     =   0x100
    sc_type_arc_fuz     =   0x200

    # sc-element premanently
    sc_type_arc_temp    =   0x400
    sc_type_arc_perm    =   0x800

    # struct node types
    sc_type_node_tuple  =   (0x80)
    sc_type_node_struct =   (0x100)
    sc_type_node_role   =   (0x200)
    sc_type_node_norole =   (0x400)
    sc_type_node_class  =   (0x800)
    sc_type_node_abstract   =   (0x1000)
    sc_type_node_material   =   (0x2000)

    sc_type_arc_pos_const_perm  =   (sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm)

    # type mask
    sc_type_element_mask    =   (sc_type_node | sc_type_link | sc_type_edge_common | sc_type_arc_common | sc_type_arc_access)
    sc_type_constancy_mask  =   (sc_type_const | sc_type_var)
    sc_type_positivity_mask =   (sc_type_arc_pos | sc_type_arc_neg | sc_type_arc_fuz)
    sc_type_permanency_mask =   (sc_type_arc_perm | sc_type_arc_temp)
    sc_type_node_struct_mask=   (sc_type_node_tuple | sc_type_node_struct | sc_type_node_role | sc_type_node_norole | sc_type_node_class | sc_type_node_abstract | sc_type_node_material)
    sc_type_arc_mask        =   (sc_type_arc_access | sc_type_arc_common | sc_type_edge_common)
    
class ScEventType:
        
    SC_EVENT_ADD_OUTPUT_ARC = 0
    SC_EVENT_ADD_INPUT_ARC = 1
    SC_EVENT_REMOVE_OUTPUT_ARC = 2
    SC_EVENT_REMOVE_INPUT_ARC = 3
    SC_EVENT_REMOVE_ELEMENT = 4


class ScAddr:
    def __init__(self, _seg, _offset):
        self.seg = _seg
        self.offset = _offset

    def __str__(self):
        return 'sc-addr: %d, %d' % (self.seg, self.offset)

    def __eq__(self, other):
        return self.seg == other.seg and self.offset == other.offset

    def to_id(self):
        return "%d" % self.to_int()
    
    def to_int(self):
        return (self.seg | self.offset << 16)
    
    @staticmethod
    def from_int(addr_int):
        return ScAddr(addr_int & 0xffff, addr_int >> 16)

    @staticmethod
    def parse_from_string(addr_str):
        """Parse sc-addr from string 'seg_offset'
        @return: Return parsed sc-addr
        """
        try:
            a = int(addr_str)
            addr = ScAddr.from_int(a)
        except:
            return None

        return addr
    
    @staticmethod
    def parse_binary(data):
        
        try:
            seg, offset = struct.unpack('=HH', data)
            return ScAddr (seg, offset) 
        except:
            return None


class ScStatItem:

    def __init__(self):
        self.time = None # unix time
        self.nodeCount = 0 # amount of all nodes
        self.arcCount = 0 # amount of all arcs
        self.linksCount = 0 # amount of all links
        self.liveNodeCount = 0 # amount of live nodes
        self.liveArcCount = 0 # amount of live arcs
        self.liveLinkCount = 0# amount of live links
        self.emptyCount = 0 # amount of empty sc-elements
        self.connectionsCount = 0 # amount of collected clients
        self.commandsCount = 0 # amount of processed commands (it includes commands with errors)
        self.commandErrorsCount = 0 # amount of command, that was processed with error
        self.isInitStat = False   # flag on initial stat save

    def toList(self):
        return [self.time,
                self.nodeCount,
                self.arcCount,
                self.linksCount,
                self.liveNodeCount,
                self.liveArcCount,
                self.liveLinkCount,
                self.emptyCount,
                self.connectionsCount,
                self.commandsCount,
                self.commandErrorsCount,
                self.isInitStat
                ]
