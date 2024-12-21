import Image from "next/image";
import NavBar from "@/components/nav-bar";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export default function Home() {
    return (
        <div className='w-2/3 flex flex-col items-center'>
            <NavBar />
            <ContainerScroll
                titleComponent={
                    <>
                        <h1 className='text-4xl font-semibold text-black dark:text-white'>
                            Unleash the power of <br />
                            <span className='text-4xl md:text-[6rem] font-bold mt-1 leading-none'>
                                Scroll Animations
                            </span>
                        </h1>
                    </>
                }
            >
                <Image src='/vercel.svg' alt='Vercel Logo' width={72} height={16} />
                EDITOOOOOOR
            </ContainerScroll>
        </div>
    );
}
