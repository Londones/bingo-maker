"use client";
import PreviewPanel from "@/components/editor/preview-panel";
import SettingsPanel from "@/components/editor/settings-panel";
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
                <div className='grid grid-cols-4 gap-8 h-full'>
                    <div className='col-span-1'>
                        <SettingsPanel />
                    </div>
                    <div className='col-span-3'>
                        <PreviewPanel />
                    </div>
                </div>
            </ContainerScroll>
        </div>
    );
}
