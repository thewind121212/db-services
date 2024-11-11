import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { prisma } from "../lib/prisma";
import { redisClient } from "../lib/redis";

export const checkHealthFn = async (
    call: ServerUnaryCall<null, { message: string, status_code: number }>,
    callback: sendUnaryData<{ message: string, status_code: number }>
) => {
    const result = await prisma.$runCommandRaw({
        hello: 1
    });

    // check redis connect 
    const redisStatus = redisClient.status;


    if (result.isWritablePrimary && redisStatus === 'ready') {
        callback(null, { message: 'Server is running', status_code: 200 });
    } else {
        callback(null, { message: 'All db not pass check', status_code: 400 });
    }

}

