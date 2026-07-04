import MovieDetailPage from "@/pages/user/home/movieDetails/MovieDetailPage.tsx";
import {useNavigate} from "react-router-dom";
import {Button} from "antd";
import {ArrowLeftOutlined} from "@ant-design/icons";

const MovieDetails = () => {


    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };


    return (

        <>

            <div
                style={{
                    maxWidth: 1280,
                    margin: "0 auto",
                    padding: "0 48px",
                }}
            >
                <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    className="movie-list-back__btn"
                    onClick={handleBack}
                >
                    Back to Home
                </Button>
            </div>

            <main>
                <MovieDetailPage/>
            </main>


        </>
    )
}

export default MovieDetails;