function generateToken(mail) {
    // HMAC SHA256
    const token = jwt.sign({mail: mail}, process.env.TOKEN_SECRET)
    console.log(`The token is: ${token}`)

    return token;

    //return jwt.sign(mail, process.env.TOKEN_SECRET, { expiresIn: '1800s' }, null);
}

function verifyPayload(token) {
    // HMAC SHA256
    const payload = jwt.verify(token, process.env.TOKEN_SECRET)
    console.log(`The verified payload is: ${JSON.stringify(payload)}`) // iat: Issued AT: Unix time when created.

    return payload
}