const isValid = function(value) {
    if (typeof(value) === 'undefined' || typeof(value) === null) {
        return false
    }
    if (typeof(value) === "number" && (value).toString().trim().length > 0) {
        return true
    }
    if (typeof(value) === "string" && (value).trim().length > 0) {
        return true
    }

}


const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

module.exports = {isValid, isValidRequestBody}


