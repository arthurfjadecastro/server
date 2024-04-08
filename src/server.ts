// Importações
import fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Instanciação do servidor Fastify
const app = fastify();

// Instanciação do cliente Prisma
const prisma = new PrismaClient();

// Definição do esquema Zod para validação do usuário
const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(), // Garanta que este campo seja uma string de email válida
});

// Rota GET para recuperar todos os usuários
app.get("/users", async (request, reply) => {
  const users = await prisma.user.findMany();
  return reply.send({ users }); // Envia a lista de usuários como resposta
});

// Rota POST para criar um novo usuário
app.post("/users", async (request, reply) => {
  // Extraia os dados de entrada do corpo da requisição e valide-os com o esquema Zod
  const { name, email } = createUserSchema.parse(request.body);

  // Crie um novo usuário no banco de dados com os dados validados
  const user = await prisma.user.create({
    data: { name, email },
  });

  // Responda com o usuário criado e um código de status HTTP 201
  return reply.status(201).send(user);
});

// Função para iniciar o servidor
// Função para iniciar o servidor
const start = async () => {
  const port = process.env.PORT ? Number(process.env.PORT) : 3333;
  try {
    await app.listen(port, "0.0.0.0"); // Ouça em todas as interfaces de rede
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

start(); // Inicie o servidor
