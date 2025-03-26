import mongoose from 'mongoose';

export async function connectDB(){
    try{
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }
        mongoose.connect(process.env.MONGODB_URI);
        const connection = mongoose.connection;

        connection.on('connection',()=>{
            console.log('Mongodb connected successfully');
        })
        connection.on('error',(err:any)=>{
            console.log('Mongodb connection error. '+err);
            process.exit();
        })
    }catch(error){
        console.log("internal server error");
    }
}