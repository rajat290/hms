import jwt from 'jsonwebtoken'

// Staff authentication middleware
const authStaff = async (req, res, next) => {
    try {
        const { stoken } = req.headers
        if (!stoken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        const token_decode = jwt.verify(stoken, process.env.JWT_SECRET)
        req.body.staffId = token_decode.id
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authStaff
