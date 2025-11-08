import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use((req,res,next)=>{
  const auth=req.headers.authorization;
  if(!auth || auth !== `Bearer ${process.env.ACTIONS_SECRET}`){
    return res.status(401).json({error:"Unauthorized"});
  }
  next();
});

app.post("/analyze-nbme",(req,res)=>{
  return res.json({ received:true, type:"nbme-analysis", input:req.body });
});

app.post("/generate-plan",(req,res)=>{
  return res.json({
    plan_30_days:["Day 1: Review weak systems","Day 2: UWorld blocks"],
    checkpoints:{ daily:"Complete 40 questions daily", weekly:"Full-length test weekly" }
  });
});

app.post("/save-state",(req,res)=>{
  return res.json({ saved:true, state:req.body });
});

import path from "path";
import { fileURLToPath } from "url";
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

app.get("/openapi.json",(req,res)=>{
  res.sendFile(path.join(__dirname,"openapi.json"));
});

const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`Backend running on port ${port}`));