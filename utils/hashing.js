const {createHmac} = require('crypto');
const bcryptjs = require('bcryptjs');

exports.doHash = (value,saltvalue) => {
    const result = bcryptjs.hash(value,saltvalue);
    return result;
}

exports.doHashValidation = (value,hashValue) => {
    const result = bcryptjs.compare(value,hashValue);
    return result;
}

exports.hmacProcess = (value,key) =>{
    const result = createHmac('sha256',key).update(value).digest('hex');
    return result;
}