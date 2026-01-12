import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { Button } from './Button';
import { getReviewPeriodLabel } from '../utils/reviewPeriods';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  recommendedDate: Date;
  reviewPeriod: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recommendedDate,
  reviewPeriod,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(recommendedDate);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(recommendedDate);
    }
  }, [isOpen, recommendedDate]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar size={24} />
            Select Due Date
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Review Period: <span className="font-medium">{getReviewPeriodLabel(reviewPeriod)}</span>
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Recommended Due Date:{' '}
            <span className="font-medium text-blue-600">
              {recommendedDate.toLocaleDateString()}
            </span>
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Due Date:
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => {
              if (date) {
                setSelectedDate(date);
              }
            }}
            minDate={new Date()}
            dateFormat="MMMM d, yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            wrapperClassName="w-full"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} className="flex-1">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

