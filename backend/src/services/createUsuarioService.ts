import prismaClient from "../prisma/index.js";

interface createUsuarioProps {
    nome:string
    email:string
    senha:string
}

class createUsuarioService {
    async execute({nome, email, senha}: createUsuarioProps) {

        
        if(!nome || !email || !senha){
            throw new Error("Por favor preencha todos os campos")
        }

        const usuario = await prismaClient.usuario.create({
            data:{
                nome,
                email,
                senha
            }
        })


        return usuario
    }
}

export { createUsuarioService }