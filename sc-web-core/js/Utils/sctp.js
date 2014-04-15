
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
    this.task_queue = [];
    this.task_timeout = 0;
    this.task_frequency = 1;
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


SctpClient.prototype._push_task = function(task) {
    this.task_queue.push(task);
    var self = this;
    
    function process() {
        var t = self.task_queue.shift();
        self.socket.onmessage = function(e) {
            var str = e.data;
            var obj = !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
                        str.replace(/"(\\.|[^"\\])*"/g, ''))) &&
                        eval('(' + str + ')');
            t.dfd.resolve(obj);
            
            if (self.task_queue.length > 0)
                self.task_timeout = window.setTimeout(process, this.task_frequency)
            else
            {
                window.clearTimeout(self.task_timeout);
                self.task_timeout = 0;
            }
        }

        self.socket.send(t.message);
            
    }
    
    if (!this.task_timeout) {
        this.task_timeout = window.setTimeout(process, this.task_frequency)
    }
};

SctpClient.prototype.new_request = function(message) {
    var dfd = new jQuery.Deferred();
    this._push_task({
        message: JSON.stringify(message),
        dfd: dfd
    });
    return dfd.promise();
};

SctpClient.prototype.erase_element = function(addr) {
    throw "Not supported";
};


SctpClient.prototype.check_element = function(addr) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_CHECK_ELEMENT, 
        args: [addr]
    });
};


SctpClient.prototype.get_element_type = function(addr) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_GET_ELEMENT_TYPE,
        args: [addr]
    });
};


SctpClient.prototype.create_node = function(type) {
    throw "Not supported";
};


SctpClient.prototype.create_arc = function(type, src, trg) {
    throw "Not supported";
};


SctpClient.prototype.create_link = function() {
    throw "Not supported";
};


SctpClient.prototype.set_link_content = function(addr, data) {
    throw "Not supported";
};


SctpClient.prototype.get_link_content = function(addr) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_GET_LINK_CONTENT,
        args: [addr]
    });
};


SctpClient.prototype.find_links_with_content = function(data) {
    throw "Not implemented";
};


SctpClient.prototype.iterate_elements = function(iterator_type, args) {
    throw "Not implemented";
};


SctpClient.prototype.find_element_by_system_identifier = function(data) {
    return this.new_request({
        cmdCode: SctpCommandType.SCTP_CMD_FIND_ELEMENT_BY_SYSITDF, 
        args: [data]
    });
};


SctpClient.prototype.set_system_identifier = function(addr, idtf) {
    throw "Not supported";
};


SctpClient.prototype.get_statistics = function() {
    throw "Not implemented";
};