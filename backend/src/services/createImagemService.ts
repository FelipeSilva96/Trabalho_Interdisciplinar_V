import type { Bytes } from "@prisma/client/runtime/library";
import prismaClient from "../prisma/index.js";

interface createImagemProps {
    dados: Bytes;
    usuarioId: string;
}

class createImagemService {
    async execute ({dados, usuarioId} : createImagemProps) {

        if (!dados || !usuarioId){
            throw new Error ("Dados ou usuario não encontrados");
        }

        const imagem = await prismaClient.imagem.create({
            data:{
                dados,
                usuarioId
            }
        })

        return imagem
    }
}

export { createImagemService }