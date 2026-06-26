import React from 'react';
import { Button } from 'antd';
import {Link, useNavigate} from 'react-router-dom';
import nowShowing from '@/assets/now-showing-2.webp';
import newsOffers from '@/assets/news.webp';
import registerNow from '@/assets/register.webp'
import loyalty from '@/assets/loyalty.webp'
import {useAuthStore} from "@/store/useAuthStore.ts";
import {authService} from "@/services/auth.service.ts";
const QUICK_LINKS = [
    {
        icon: nowShowing,
        label: 'Movie',
        sub: 'Movie showing or upcoming',
        path:'/'
    },
    {
        icon: newsOffers,
        label: 'News',
        sub: 'News and offers',
        path:'/'

    },
    {
        icon: registerNow,
        label: 'Register',
        sub: 'Register now',
        path:'/'

    },
    {
        icon: loyalty,
        label: 'Loyalties',
        sub: 'Loyalties programing',
        path:'/'

    },
];

const HomeHeader: React.FC = () => {
    const { isAuthenticated ,logout } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error(e);
        }
        logout();
        navigate('/login');
    };
    return (
        <>
            <div className="home__topbar">
                <div className="topbar__inner">
                    <span className="topbar__item">🎟 NEWS & OFFERS</span>
                    <span className="topbar__item">🎫 MY TICKETS</span>
                    <Link to={"/account"} style={{textDecoration:'none'}}>
                        <span className="topbar__item">👤 ACCOUNT</span>

                    </Link>
                    {
                        !isAuthenticated ? (
                            <>
                                <Link to="/login" className="topbar__item">
                                    SIGN IN
                                </Link>

                                <Link to="/register" className="topbar__item">
                                    REGISTER
                                </Link>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="topbar__item topbar__logout"
                                onClick={handleLogout}
                            >
                                LOGOUT
                            </button>
                        )
                    }
                </div>
            </div>

            <header className="home__header">
                <div className="header__inner">
                    <Link to="/" className="header__logo">
                        <span className="logo-text">PREMIERE</span>
                        <span className="logo-sub">CINEMA</span>
                    </Link>

                    <nav className="header__nav">
                        <Link to="/movies" className="header__nav-link">
                            MOVIES
                        </Link>
                        <Link to="/theaters" className="header__nav-link">
                            THEATERS
                        </Link>
                        <Link to="/membership" className="header__nav-link">
                            MEMBERSHIP
                        </Link>
                        <Link to="/events" className="header__nav-link">
                            EVENTS
                        </Link>
                    </nav>

                    <Link to="/booking">
                        <Button
                            type="primary"
                            danger
                            style={{
                                borderRadius: 2,
                                fontWeight: 700,
                                letterSpacing: 1,
                            }}
                        >
                            🎟 TICKETS
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="film-strip">
                {Array.from({ length: 30 }).map((_, i) => (
                    <span key={i} className="film-strip__hole" />
                ))}
            </div>

            <div className="quick-links">
                {QUICK_LINKS.map((q) => (
                    <Link
                        key={q.label}
                        to={q.path}
                        className="quick-link"
                    >
                        <img
                            src={q.icon}
                            alt={q.label}
                            className="quick-link__icon"
                        />

                        <span className="quick-link__label">
        {q.label}
    </span>

                        <span className="quick-link__sub">
        {q.sub}
    </span>
                    </Link>
                ))}
            </div>
        </>
    );
};

export default HomeHeader;