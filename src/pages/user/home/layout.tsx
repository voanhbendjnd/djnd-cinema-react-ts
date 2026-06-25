import { Outlet } from "react-router-dom";
import HomeHeader from "@/pages/user/home/header.tsx";
import HomeFooter from "@/pages/user/home/footer.tsx";

const HomeLayout = () => {
    return (
        <>
            <HomeHeader />

            <main>
                <Outlet />
            </main>

            <HomeFooter />
        </>
    );
};

export default HomeLayout;