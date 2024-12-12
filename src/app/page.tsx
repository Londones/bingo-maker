import Image from "next/image";
import NavBar from "@/components/nav-bar";

export default function Home() {
    return (
        <div className='w-2/3 flex flex-col items-center'>
            <NavBar />
            <h1>Home</h1>
            <Image src='/vercel.svg' alt='Vercel Logo' width={72} height={16} />
        </div>
    );
}
