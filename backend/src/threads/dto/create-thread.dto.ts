import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}