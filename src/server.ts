// Importações
import fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"; // Importe o bcrypt para a criptografia de senha
import { z } from "zod";
import jwt from "jsonwebtoken"; // Importe jwt para gerar tokens

// Instanciação do servidor Fastify
const app = fastify();

// Instanciação do cliente Prisma
const prisma = new PrismaClient();

// Esquema Zod para validação de registro do usuário
const registerUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6), // Assegure que a senha tenha pelo menos 6 caracteres
});

// Esquema Zod para validação de login do usuário
const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Rota POST para registro de usuário
app.post("/register", async (request, reply) => {
  try {
    // Validar entrada usando Zod
    const { name, email, password } = registerUserSchema.parse(request.body);

    // Checar se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply
        .status(400)
        .send({ error: "Usuário com este e-mail já existe." });
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Enviar resposta de sucesso
    return reply
      .status(201)
      .send({ message: "Usuário registrado com sucesso!", user });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao registrar o usuário." });
  }
});

// Rota POST para login de usuário
app.post("/login", async (request, reply) => {
  try {
    const { email, password } = loginUserSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET, // Use a chave secret armazenada nas variáveis de ambiente
        { expiresIn: "24h" }
      );
      return reply.send({ message: "Login bem-sucedido!", token });
    } else {
      return reply.status(401).send({ error: "E-mail ou senha inválidos." });
    }
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro interno do servidor." });
  }
});

// Rota GET para recuperar todos os usuários
app.get("/users", async (request, reply) => {
  const users = await prisma.user.findMany();
  return reply.send({ users });
});

// Função para iniciar o servidor
const start = async () => {
  const port = process.env.PORT ? Number(process.env.PORT) : 3333;
  try {
    await app.listen(port, "0.0.0.0");
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
