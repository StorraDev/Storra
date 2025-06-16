import { Country } from "../Country/countryModel";
import { School }from "../School/schoolModel";
import { Student } from "../Student/studentModel";
import { Individual } from "../Individual/indvidualModel"
import { ApiError } from "./ApiError";

type UserTypes = "country" | "student" | "school" | "individual";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const generateAccessAndRefreshToken = async (
  userId: string,
  userType: UserTypes
): Promise<Tokens> => {
  let user;

  switch (userType) {
    case "country":
      user = await Country.findById(userId);
      break;
    case "student":
      user = await Student.findById(userId);
      break;
    case "school":
      user = await School.findById(userId);
      break;
    case "individual":
      user = await Individual.findById(userId);
      break;
    default:
      throw new ApiError({ statusCode: 400, message: "Invalid user type" });
  }

  if (!user) {
    throw new ApiError({ statusCode: 404, message: "User not found" });
  }

  const accessToken = await (user as any).generateAccessToken();
  const refreshToken = await (user as any).generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};
