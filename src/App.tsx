import { BrowserRouter } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import { ProConfigProvider, enUSIntl } from '@ant-design/pro-components';
import enUS from 'antd/locale/en_US';
import AppRoutes from './routes/app.route.tsx';

function App() {
    return (
        <ConfigProvider
            locale={enUS}
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#ffd700',
                    colorBgContainer: '#141414',
                    fontFamily: "'Outfit', sans-serif",
                    borderRadius: 8,
                },
                components: {
                    Button: {
                        colorPrimary: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)',
                        colorPrimaryHover: 'linear-gradient(135deg, #ffe55c 0%, #ffd700 100%)',
                        colorPrimaryActive: 'linear-gradient(135deg, #d4af37 0%, #b5952f 100%)',
                        colorTextLightSolid: '#000',
                        fontWeight: 600,
                    },
                },
            }}
        >
            <AntdApp>
                <ProConfigProvider intl={enUSIntl}>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </ProConfigProvider>
            </AntdApp>
        </ConfigProvider>
    );
}

export default App;