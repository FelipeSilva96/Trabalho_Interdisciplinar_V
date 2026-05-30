import prismaClient from "../prisma/index.js";

interface listImagemProps {
    usuarioId : string
}

class listImagemService {
    async execute ({usuarioId} : listImagemProps) {
        if (!usuarioId) {
            throw new Error ("Id de usuário")
        }

        const imagens = await prismaClient.imagem.findMany({
            where:{
                usuarioId: usuarioId
            }
        })

        return imagens
    }

}

export { listImagemService }