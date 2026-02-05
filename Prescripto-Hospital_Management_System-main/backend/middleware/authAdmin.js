import jwt from "jsonwebtoken"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        const atoken = req.header('atoken')
        if (!atoken) {
            console.log("No token found in headers")
            return res.json({ success: false, message: 'Not Authorized Login Again (Missing Token)' })
        }
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
        if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            console.log("Token decode mismatch:", token_decode)
            return res.json({ success: false, message: 'Not Authorized Login Again (Token Mismatch)' })
        }
        next()
    } catch (error) {
        console.log("Auth error:", error)
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin;