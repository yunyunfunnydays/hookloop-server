import { CorsOptions } from "cors";

const corsOptions: CorsOptions = {
  origin: ["http://localhost:3000/", "https://hookloop-client.onrender.com/"],
  credentials: true,
};

export default corsOptions;