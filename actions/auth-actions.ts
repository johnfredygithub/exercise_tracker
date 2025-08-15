import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
export const signInEmailPassword = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    const dbUser = await createUser(email, password);
    return dbUser;
  }
  if (!bcrypt.compareSync(password, user.password ?? "")) {
    return null;
  }
  return user;
};

const createUser = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    console.log("Creating user:", email);
    const user = await prisma.user.create({
      data: {
        email: email,
        password: bcrypt.hashSync(password),
        name: email.split("@")[0],
      },
    });
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Error creating user");
  }
};
