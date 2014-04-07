sc_addr_from_id = function(sc_id) {
    var a = sc_id.split("_");
    var seg = parseInt(a[0]);
    var offset = parseInt(a[1]);
    
    return (seg << 16) | offset;
}

SctpClient = function() {
    this.socket = null;
}

SctpClient.prototype.connect = function(url) {
   this.socket = new SockJS(url);
    
   this.socket.onopen = function() {
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
}

SctpClient.prototype.set_system_identifier = function(addr, idtf) {
}

SctpClient.prototype.get_statistics = function() {
}