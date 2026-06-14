import React, { useEffect, useState } from 'react';
import {
    ModalForm,
    ProFormText,
    ProFormTextArea,
    ProFormSelect,
    ProFormDigit,
    ProFormDateTimePicker,
} from '@ant-design/pro-components';
import {Upload, message, Form, notification} from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { MovieGenre, MovieStatus } from '@/types/movie.types';
import type { AdminMovieDTO } from '@/types/movie.types';
import { movieService } from '@/services/movie.service';
import { baseURL } from '@/services/axiosClient';
import dayjs from 'dayjs';
import ImgCrop from 'antd-img-crop';
import '@/styles/movie.admin.css';

interface MovieUpdateModalProps {
    open: boolean;
    movie: AdminMovieDTO | null;
    onClose: () => void;
    onSuccess: () => void;
}

const MovieUpdateModal: React.FC<MovieUpdateModalProps> = ({ open, movie, onClose, onSuccess }) => {
    const [form] = Form.useForm<AdminMovieDTO>();
    const [loading, setLoading] = useState(false);
    // Current poster path returned by backend (could be in moviePoster folder, or movie-temps if just uploaded)
    const [posterUrl, setPosterUrl] = useState<string | undefined>(undefined);
    // Whether posterUrl currently points at a temp upload (movie-temps) vs the final moviePoster folder
    const [isTempPoster, setIsTempPoster] = useState(false);
    const [api, contextHolder] = notification.useNotification();

    // Sync form + poster preview whenever the target movie changes / modal opens
    useEffect(() => {
        if (open && movie) {
            form.setFieldsValue({
                ...movie,
                releaseDate: movie.releaseDate ? dayjs(movie.releaseDate) as any : undefined,
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPosterUrl(movie.posterUrl);
            setIsTempPoster(false);
        }
    }, [open, movie, form]);

    const handleChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
        if (info.file.status === 'uploading') {
            setLoading(true);
            return;
        }
    };

    const customUpload = async (options: any) => {
        const { file, onSuccess: uploadSuccess, onError } = options;
        try {
            setLoading(true);
            const tempUrl = await movieService.uploadTempFile(file as File);
            setPosterUrl(tempUrl);
            setIsTempPoster(true);
            uploadSuccess(tempUrl);
            api.success({
                message:'Upload image successfully',
                placement: 'topRight'
            })
        } catch (error: any) {
            onError(error);
            api.error({
                message:'Update failure!',
                placement: 'topRight',
                description: error.response?.data?.message || 'Failed to update',
            })
        } finally {
            setLoading(false);
        }
    };

    const uploadButton = (
        <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Upload</div>
        </div>
    );

    // Resolve preview src depending on whether posterUrl is a fresh temp file or the saved poster
    const posterSrc = posterUrl
        ? isTempPoster
            ? `${baseURL}/api/v1/files/movie-temps/${posterUrl}`
            : `${baseURL}/api/v1/files/${posterUrl}`
        : undefined;

    return (
        <>
            {contextHolder}
            <ModalForm<AdminMovieDTO>
                title={`Update Movie${movie?.title ? ` - ${movie.title}` : ''}`}
                form={form}
                open={open}
                onOpenChange={(visible) => {
                    if (!visible) onClose();
                }}
                modalProps={{
                    // Keep mounted/state when closed via Close so we don't lose context unexpectedly,
                    // but destroy on real close to reset internal field state on next open.
                    destroyOnClose: true,
                    onCancel: onClose,
                }}
                submitter={{
                    searchConfig: {
                        submitText: 'Save changes',
                        resetText: 'Close',
                    },
                }}
                onFinish={async (values) => {
                    if (!movie?.id) {
                        message.error('Missing movie ID');
                        return false;
                    }

                    try {
                        const payload: AdminMovieDTO = {
                            ...values,
                            id: movie.id,
                            posterUrl: posterUrl,
                            releaseDate: values.releaseDate
                                ? dayjs(values.releaseDate as never).format('YYYY-MM-DDTHH:mm:ss')
                                : undefined,
                        };

                        const res = await movieService.updateMovie(payload);

                        const updated: AdminMovieDTO = res.data;

                        // Re-fill the form with whatever the backend returned (e.g. moved posterUrl path)
                        form.setFieldsValue({
                            ...updated,
                            releaseDate: updated.releaseDate ? (dayjs(updated.releaseDate) as never) : undefined,
                        });
                        setPosterUrl(updated.posterUrl);
                        setIsTempPoster(false);

                        api.success({
                            message:'Update successfully',
                            placement: 'topRight'
                        })
                        // Refresh the table list, but DO NOT close the modal
                        onSuccess();
                        return false;
                    } catch (error: any) {
                        api.error({
                            message:'Update failure!',
                            placement: 'topRight',
                            description: error.response?.data?.message || 'Failed to update',
                        });
                        return false;
                    }
                }}
            >
                <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                        <ProFormText
                            name="title"
                            label="Title"
                            placeholder="Enter movie title"
                            rules={[{ required: true, message: 'Title is required' }]}
                        />
                        <ProFormTextArea
                            name="description"
                            label="Description"
                            placeholder="Enter movie description"
                        />
                        <ProFormDigit
                            name="durationMinutes"
                            label="Duration (minutes)"
                            placeholder="Enter duration"
                            min={1}
                            rules={[{ required: true, message: 'Duration is required' }]}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <ProFormSelect
                            name="genre"
                            label="Genre"
                            options={Object.values(MovieGenre).map((genre) => ({
                                label: genre,
                                value: genre,
                            }))}
                            rules={[{ required: true, message: 'Genre is required' }]}
                        />
                        <ProFormText
                            name="director"
                            label="Director"
                            placeholder="Enter director name"
                        />
                        <ProFormDateTimePicker
                            name="releaseDate"
                            label="Release Date"
                            rules={[{ required: true, message: 'Release Date is required' }]}
                        />
                        <ProFormSelect
                            name="status"
                            label="Status"
                            options={Object.values(MovieStatus).map((status) => ({
                                label: status,
                                value: status,
                            }))}
                            rules={[{ required: true, message: 'Status is required' }]}
                        />

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 8 }}>Poster Image</label>
                            <ImgCrop rotationSlider aspect={2 / 3}>
                                <Upload
                                    name="avatar"
                                    listType="picture-card"
                                    className="avatar-uploader-poster"
                                    showUploadList={false}
                                    customRequest={customUpload}
                                    onChange={handleChange}
                                    accept=".png,.jpeg,.jpg,.webp"
                                >
                                    {posterSrc ? (
                                        <img
                                            src={posterSrc}
                                            alt="poster"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        uploadButton
                                    )}
                                </Upload>
                            </ImgCrop>
                        </div>
                    </div>
                </div>
            </ModalForm>
        </>

    );
};

export default MovieUpdateModal;