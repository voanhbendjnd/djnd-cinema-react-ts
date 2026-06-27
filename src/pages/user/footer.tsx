import React from 'react';

const HomeFooter: React.FC = () => {
    return (
        <footer className="home__footer">
            <div className="footer__inner">
                <div className="footer__brand">
                    <span
                        className="logo-text"
                        style={{ fontSize: 20 }}
                    >
                        PREMIERE
                    </span>

                    <span
                        style={{
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: 12,
                        }}
                    >
                        © 2026 Premiere Cinema
                    </span>
                </div>

                <div className="footer__links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Use</a>
                    <a href="#">Contact</a>
                </div>
            </div>
        </footer>
    );
};

export default HomeFooter;