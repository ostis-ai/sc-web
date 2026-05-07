/* Object to read/write bynary data
 */
BinaryData = function (size, data) {

};

BinaryData.prototype.calcSize = function () {
};

/*!
 * Unpack data types from string, with specified format
 * @param {str} fmt String that contains data format
 * @param {ArrayBuffer} data Array buffer, that contains binary data for unpacking
 *
 * @returns Returns array, that contains unpacked data
 */
BinaryData.prototype.unpack = function (fmt, data) {
};

/*! Pack data to binary array buffer
 * @param 
 */
BinaryData.prototype.pack = function (fmt, args) {
};