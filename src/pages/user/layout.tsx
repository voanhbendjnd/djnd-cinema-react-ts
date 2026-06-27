import { Outlet } from "react-router-dom";
import HomeHeader from "@/pages/user/header.tsx";
import HomeFooter from "@/pages/user/footer.tsx";

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