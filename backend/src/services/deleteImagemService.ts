import prismaClient from "../prisma/index.js";

interface deleteImagemProps {
    id:string
}

class deleteImagemSerivce {
    async execute ({id} : deleteImagemProps) { //vamos passar o ID da imagem para o banco e deleta la usando dito ID

        if (!id) {
            throw new Error ("Imagem não encontrada")
        }

        const imagem = await prismaClient.imagem.findFirst({
            where:{
                id:id
            }
        })

        if (!imagem) {
            throw new Error ("Erro ao remover a imagem")
        }

        await prismaClient.imagem.delete({
            where:{
                id: imagem.id
            }
        })

        return {message: "Imagem deletada com sucesso"}
    }
}

export {deleteImagemSerivce}