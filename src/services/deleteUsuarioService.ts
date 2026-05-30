import prismaClient from "../prisma/index.js";
import {type FastifyRequest, type FastifyReply} from "fastify";

interface deleteUsuarioProps{
    id:string
}

class deleteUsuarioService {
    async execute ({id} : deleteUsuarioProps) {
        
        const usuario = await prismaClient.usuario.findFirst({
            where:{
                id: id
            }
        })

        if(!usuario){
            throw new Error ("Usuário não existe")
        }

        await prismaClient.usuario.delete({
            where:{
                id: usuario.id
            }
        })

        return {message: "Deletado com sucesso"}
    }
}

export { deleteUsuarioService }