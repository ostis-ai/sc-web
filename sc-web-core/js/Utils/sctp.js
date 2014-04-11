
var SctpCommandType = {
    SCTP_CMD_UNKNOWN:           0x00, // unkown command
    SCTP_CMD_CHECK_ELEMENT:     0x01, // check if specified sc-element exist
    SCTP_CMD_GET_ELEMENT_TYPE:  0x02, // return sc-element type
    SCTP_CMD_ERASE_ELEMENT:     0x03, // erase specified sc-element
    SCTP_CMD_CREATE_NODE:       0x04, // create new sc-node
    SCTP_CMD_CREATE_LINK:       0x05, // create new sc-link
    SCTP_CMD_CREATE_ARC:        0x06, // create new sc-arc
    SCTP_CMD_GET_ARC_BEGIN:     0x07, // return begin element of sc-arc
    SCTP_CMD_GET_ARC_END:       0x08, // return end element of sc-arc
    SCTP_CMD_GET_LINK_CONTENT:  0x09, // return content of sc-link
    SCTP_CMD_FIND_LINKS:        0x0A, // return sc-links with specified content
    SCTP_CMD_SET_LINK_CONTENT:  0x0b, // setup new content for the link
    SCTP_CMD_ITERATE_ELEMENTS:  0x0C, // return base template iteration result

    SCTP_CMD_FIND_ELEMENT_BY_SYSITDF:   0xa0, // return sc-element by it system identifier
    SCTP_CMD_SET_SYSIDTF:       0xa1, // setup new system identifier for sc-element
    SCTP_CMD_STATISTICS:        0xa2, // return usage statistics from server

    SCTP_CMD_SHUTDOWN:          0xfe // disconnect client from server
};


var SctpResultCode = {
    SCTP_RESULT_OK:                 0x00, 
    SCTP_RESULT_FAIL:               0x01, 
    SCTP_RESULT_ERROR_NO_ELEMENT:   0x02 // sc-element wasn't founded
}


var SctpIteratorType = {
    SCTP_ITERATOR_3F_A_A:       0,
    SCTP_ITERATOR_3A_A_F:       1,
    SCTP_ITERATOR_3F_A_F:       2,
    SCTP_ITERATOR_5F_A_A_A_F:   3,
    SCTP_ITERATOR_5_A_A_F_A_F:  4,
    SCTP_ITERATOR_5_F_A_F_A_F:  5,
    SCTP_ITERATOR_5_F_A_F_A_A:  6,
    SCTP_ITERATOR_5_F_A_A_A_A:  7,
    SCTP_ITERATOR_5_A_A_F_A_A:  8
}


sc_addr_from_id = function(sc_id) {
    var a = sc_id.split("_");
    var seg = parseInt(a[0]);
    var offset = parseInt(a[1]);
    
    return (seg << 16) | offset;
}

SctpClient = function() {
    this.socket = null;
}

SctpClient.prototype.connect = function(url, success) {
   this.socket = new SockJS(url);
    
   this.socket.onopen = function() {
       success();
       console.log('open');
   };
   this.socket.onmessage = function(e) {
       console.log('message', e.data);
   };
   this.socket.onclose = function() {
       console.log('close');
   };
    
}

SctpClient.prototype.erase_element = function(addr) {
}

SctpClient.prototype.check_element = function(addr) {
    this.socket.send(JSON.stringify({cmdCode: SctpCommandType.SCTP_CMD_CHECK_ELEMENT, args: [addr]}));
}

SctpClient.prototype.get_element_type = function(addr) {
}

SctpClient.prototype.create_node = function(type) {
}

SctpClient.prototype.create_arc = function(type, src, trg) {
}

SctpClient.prototype.create_link = function() {
}

SctpClient.prototype.set_link_content = function(addr, data) {
}

SctpClient.prototype.get_link_content = function(addr) {
}

SctpClient.prototype.find_links_with_content = function(data) {
}

SctpClient.prototype.iterate_elements = function(iterator_type, args) {
}

SctpClient.prototype.find_element_by_system_identifier = function(data) {
     this.socket.send(JSON.stringify({cmdCode: SctpCommandType.SCTP_CMD_FIND_ELEMENT_BY_SYSITDF, args: [data]}));
}

SctpClient.prototype.set_system_identifier = function(addr, idtf) {
}

SctpClient.prototype.get_statistics = function() {
}