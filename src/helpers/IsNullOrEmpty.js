module.exports = (value) => {
    if(value === null || value === undefined || value === '' || value.length === 0 || typeof value === undefined) {
        return true;
    }
    else{
        return false;
    }
};