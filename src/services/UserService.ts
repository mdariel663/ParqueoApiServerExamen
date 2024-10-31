import UserModel from "../models/User/UserModel";
import EmailRequest from "../models/User/EmailRequest";
import PasswordRequest from "../models/User/PasswordRequest";
import RoleRequest from "../models/User/RoleRequest";
import UserNameRequest from "../models/User/UserNameRequest";
import { UUID } from "crypto";
import UserModelError from "../models/Errors/UserModelError";
import PhoneRequest from "../models/User/PhoneRequest";
import UserFilterModel from "../models/UserFilterModel";
import User from "../models/User/UserInterface";
import UserResponse, { UserLoginResponse } from "../models/User/UserResponse";
import UserLogged from "../models/User/UserInterface";

class UserService {
  static async deleteUser(currentUserId: UUID, userDeleteId: UUID | undefined): Promise<{ success: boolean; message: string; userId: UUID }> {
    const userModel: UserModel = new UserModel();
    const currentUser: UserLogged | null = await userModel.getCurrentUser(currentUserId);

    // Verifica si currentUser es nulo antes de acceder a su rol
    if (!currentUser) {
      throw new UserModelError("Usuario actual no encontrado");
    }

    if (userDeleteId === undefined) {
      console.log("aaaaaaaaaaaaaaaaaaaaa")
      userDeleteId = currentUserId;
    } else if (currentUser.role !== "admin") {
      throw new UserModelError("No se puede eliminar un usuario si usted no es administrador.");
    }
    console.log("cccccccccccccccccccccccc")

    const userData = await userModel.getUserById(userDeleteId);

    if (userData === null) {
      throw new UserModelError("El usuario no existe");
    }

    await userModel.deleteUser(userDeleteId);
    return {
      success: true,
      message: "Usuario eliminado",
      userId: userDeleteId,
    };
  }


  static createUser = async ({
    name,
    email,
    phone,
    password,
    role
  }: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }): Promise<{
    success: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
    }
  }> => {
    const userModel: UserModel = new UserModel();
    const requestData = {
      name: new UserNameRequest(name),
      email: new EmailRequest(email),
      phone: new PhoneRequest(phone),
      password: new PasswordRequest(password),
      role: new RoleRequest(role),
    };

    // Verificar si hay errores en los datos
    (Object.keys(requestData) as (keyof typeof requestData)[]).forEach((key) => {
      if (requestData[key].messageError) {
        throw new UserModelError(requestData[key].messageError);
      }
    });

    const userExists = await UserService.userExists(email, phone);
    if (userExists) {
      throw new UserModelError('El correo electrónico o el teléfono ya están en uso.');
    }
    // Crear el usuario en la base de datos
    const user = await userModel.create(requestData);
    return { success: true, user: user };
  }



  static async userExists(email: string, phone: string): Promise<boolean> {
    const userModel: UserModel = new UserModel();
    const filter: UserFilterModel = new UserFilterModel({ "email": email, "phone": phone });
    const user: unknown[] | null = await userModel.findUserByFilter(email, phone, filter);
    return user === null;
  }

  static async updateUser(
    userId: UUID,
    name?: string,
    email?: string,
    phone?: string,
    password?: string,
    role?: string
  ): Promise<{ affectedRows: number } | null> {
    const userModel: UserModel = new UserModel();
    return await userModel.updateUser(userId, {
      name,
      email,
      phone,
      password,
      role,
    });
  }

  static getCurrentUser = async (userId: UUID): Promise<UserLogged> => {
    const userModel: UserModel = new UserModel();
    const user = await userModel.getCurrentUser(userId);
    console.log("user", user)
    if (user === null) {
      throw new UserModelError("Usuario actual no encontrado");
    }
    return user;
  }

  static getUsers = async (): Promise<User[]> => {
    const userModel: UserModel = new UserModel();
    return await userModel.getUsers();
  }

  static loginUser = async (email: string | undefined, phone: string | undefined, password: string): Promise<UserLoginResponse> => {
    if (!password || (email !== undefined && phone !== undefined)) {
      throw new UserModelError(
        "Los campos email o phone y password son obligatorios"
      );
    }

    const emailRequest: EmailRequest | null = (email !== undefined) ? new EmailRequest(email) : null;
    const phoneRequest: PhoneRequest | null = (phone !== undefined) ? new PhoneRequest(phone) : null;
    const passwordRequest: PasswordRequest = new PasswordRequest(password);

    if (emailRequest && !emailRequest.isValid) {
      throw new UserModelError("El formato de email no es válido");
    }

    if (phoneRequest && !phoneRequest.isValid) {
      throw new UserModelError("El formato de phone no es válido");
    }

    if (!passwordRequest.isValid) {
      throw new UserModelError(passwordRequest.messageError);
    }

    const userModel: UserModel = new UserModel();
    const user: UserResponse | null =
      await userModel.checkLogin(
        emailRequest ?? phoneRequest,
        passwordRequest).then((user: UserResponse | null) => {
          if (user === null) {
            throw new UserModelError(
              "El usuario no existe o la contraseña es incorrecta"
            );
          }
          return user;
        }).catch((_e: unknown) => {
          console.log("error", _e)
          throw new UserModelError(
            "El usuario no existe o la contraseña es incorrecta"
          );
        });

    return { success: true, message: "Usuario autenticado", ...user };
  }
}

export default UserService;
