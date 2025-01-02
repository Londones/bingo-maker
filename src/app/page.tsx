"use client";
import NavBar from "@/components/nav-bar";
import Editor from "@/components/editor/editor";
//import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export default function Home() {
    return (
        <div className='w-10/12 flex flex-col items-center'>
            <NavBar />
            <Editor />
        </div>
    );
}
