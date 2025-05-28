import {Request, Response} from "express";

const healthCheck = async (req: Request, res: Response) => {
    res.send(
        {
            status: "ok",
            message: "Health check successful",
            timestamp: new Date().toISOString()
        }
    )
}


export {healthCheck}