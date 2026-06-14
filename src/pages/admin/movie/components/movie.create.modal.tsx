import React, { useState } from 'react';
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormDigit,
  ProFormDateTimePicker,
} from '@ant-design/pro-components';
import {Upload, message, notification} from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { MovieGenre, MovieStatus } from '@/types/movie.types';
import type { AdminMovieDTO } from '@/types/movie.types';
import { movieService } from '@/services/movie.service';
import { baseURL } from '@/services/axiosClient';
import dayjs from 'dayjs';
import ImgCrop from "antd-img-crop";
import '@/styles/movie.admin.css';

interface MovieCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MovieCreateModal: React.FC<MovieCreateModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [api, contextHolder] = notification.useNotification();
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
      setImageUrl(tempUrl);
      uploadSuccess(tempUrl);
      api.error({
        message:'Create movie successfully!',
        placement: 'topRight',
      })
    } catch (error: any) {
      onError(error);
      api.error({
        message:'Create movie failure!',
        placement: 'topRight',
        description: error.response?.data?.message || 'Failed to update',
      })    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
      <>
        {contextHolder}
        <ModalForm<AdminMovieDTO>
            title="Create New Movie"
            open={open}
            onOpenChange={(visible) => {
              if (!visible) onClose();
            }}
            modalProps={{
              destroyOnClose: true,
              onCancel: onClose,
            }}
            submitter={{
              searchConfig: {
                submitText: 'Save',
                resetText: 'Close',
              },
            }}
            onFinish={async (values) => {
              try {
                if (!imageUrl) {
                  message.error('Please upload a poster image');
                  return false;
                }

                const payload: AdminMovieDTO = {
                  ...values,
                  posterUrl: imageUrl,
                  releaseDate: values.releaseDate ? dayjs(values.releaseDate).format('YYYY-MM-DDTHH:mm:ss') : undefined,
                };

                await movieService.createMovie(payload);
                message.success('Movie created successfully');
                setImageUrl(undefined);
                onSuccess();
                return true;
              } catch (error: any) {
                message.error(error.response?.data?.message || 'Failed to create movie');
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
                  fieldProps={{
                    disabledDate: (current) => {
                      return current && current < dayjs().startOf('day');
                    },
                  }}
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
                    {imageUrl ? (
                        <img src={`${baseURL}/api/v1/files/movie-temps/${imageUrl}`} alt="poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

export default MovieCreateModal;
