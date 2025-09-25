'use client';

import React, { useRef, useState, useCallback } from 'react';

interface ImageUploadZoneProps {
  label: string;
  required?: boolean;
  onImageSelect: (file: File) => void;
  preview?: string;
  accept?: string;
  capture?: 'user' | 'environment';
  className?: string;
}

export default function ImageUploadZone({
  label,
  required = false,
  onImageSelect,
  preview,
  accept = 'image/*',
  capture,
  className = ''
}: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getCameraText = () => {
    if (capture === 'environment') return 'カメラで撮影';
    if (capture === 'user') return 'フロントカメラで撮影';
    return '画像を選択';
  };

  const getActionText = () => {
    const cameraAction = capture ? 'カメラを起動' : 'ギャラリーから選択';
    return `タップして${cameraAction}するか、ここにドラッグ&ドロップ`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-orange-400 bg-orange-50'
            : preview
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          capture={capture}
          onChange={handleInputChange}
          className="hidden"
          required={required}
        />
        
        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt={`${label}プレビュー`}
              className="max-w-full h-32 object-contain mx-auto border border-gray-200 rounded"
            />
            <p className="text-sm text-green-600 font-medium">
              📷 画像が選択されました
            </p>
            <p className="text-xs text-gray-500">
              タップして変更
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl text-gray-400">
              📷
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                {getCameraText()}
              </p>
              <p className="text-xs text-gray-500">
                {getActionText()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
