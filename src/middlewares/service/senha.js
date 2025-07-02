const bcrypt = require('bcrypt');

const hash = {
    createHash: async (senha) =>{
        const salt = 13;
        const genSalt = await bcrypt.genSalt(salt);
        const senhaHash = await bcrypt.hash(senha, genSalt);
        return senhaHash;
    },
    findHash: async (senha, senhaHash) =>{
        const result = await bcrypt.compare(senha, senhaHash);
        return result;
    }
}

module.exports = hash;