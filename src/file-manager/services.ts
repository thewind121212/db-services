import { sendUnaryData, Server, ServerUnaryCall } from "@grpc/grpc-js";
import { prisma } from "../lib/prisma";

// Define the interface for the gRPC call request data
interface CreateFileRequest {
    fileId: string;
    filename: string;
    extension: string;
    size: number;
}

// Define the interface for the gRPC call response data
interface CreateFileResponse {
    status_code: number;
    message: string;
}

// Implement the CreateFileHandle method
export async function createFileHandle(
    call: ServerUnaryCall<CreateFileRequest, CreateFileResponse>,
    callback: sendUnaryData<CreateFileResponse>
): Promise<void> {
    const { fileId, filename, extension, size } = call.request;

    try {
        // Write to the database using Prisma
        const newFile = await prisma.file.create({
            data: { fileId, filename, extension, size: Number(size), uploadDate: new Date() },
        });

        callback(null, {
            status_code: 200,
            message: 'File created successfully',
        });
    } catch (error) {
        console.error('Error creating file:', error);

        callback(null, {
            status_code: 500,
            message: 'Internal server error',
        });
    }
}



// Implement the getAllFilesHandle method

interface GetAllFilesResponse {
    files: {
        dateUploaded: string;
        filename: string;
        id: string;
        size: number;
    }[]
    count: number;
    status_code: number;
}

export async function getAllFilesHandle(
    call: ServerUnaryCall<null, GetAllFilesResponse>,
    callback: sendUnaryData<GetAllFilesResponse>
) {
    try {
        const [files, count] = await prisma.$transaction([
            prisma.file.findMany(),
            prisma.file.count(),
        ])

        console.log(files)

        callback(null, {
            files: files.map((file) => ({
                dateUploaded: file.uploadDate.toISOString(),
                filename: file.filename,
                id: file.fileId,
                size: Number(file.size),
            })),
            count: count,
            status_code: 200,
        })

    } catch (error) {
        console.error('Error fetching files:', error);
        callback(null, {
            files: [],
            count: 0,
            status_code: 500,
        })
    }
}


// Implement the getFileByIdHandle method

interface GetFileByIdRequest {
    fileId: string;
}

interface GetFileByIdResponse {
    file: {
        dateUploaded: string;
        filename: string;
        id: string;
        size: number;
    } | null;
    status_code: number;
}


export async function getFileDetailHandle(
    call: ServerUnaryCall<GetFileByIdRequest, GetFileByIdResponse>,
    callback: sendUnaryData<GetFileByIdResponse>
) {
    const { fileId } = call.request;

    try {
        const file = await prisma.file.findFirst({
            where: {
                fileId: fileId,
            },
        });


        if (file) {
            callback(null, {
                file: {
                    dateUploaded: file.uploadDate.toISOString(),
                    filename: file.filename,
                    id: file.fileId,
                    size: Number(file.size),
                },
                status_code: 200,
            });
        } else {
            callback(null, {
                file: null,
                status_code: 404,
            });
        }
    } catch (error) {
        console.error('Error fetching file:', error);
        callback(null, {
            file: null,
            status_code: 500,
        });
    }

}

//delete file 
interface DeleteFileRequest {
    fileId: string;
}

interface DeleteFileResponse {
    status_code: number;
    message: string;
}


export  const deleteFileHandle = async (
    call: ServerUnaryCall<DeleteFileRequest, DeleteFileResponse>,
    callback: sendUnaryData<DeleteFileResponse>
) => {

    const { fileId } = call.request

    try {
        await prisma.file.delete({
            where: {
                fileId: fileId
            }
        })

        callback(null, {
            status_code: 200,
            message: 'File deleted successfully'
        })

    } catch (error) {
        callback(null, {
            status_code: 500,
            message: 'Internal server'
        })

    }
}