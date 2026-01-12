declare module 'react-datepicker' {
  import { Component } from 'react';
  
  export interface ReactDatePickerProps {
    selected?: Date | null;
    onChange: (date: Date | null) => void;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: string;
    className?: string;
    wrapperClassName?: string;
    [key: string]: any;
  }
  
  export default class DatePicker extends Component<ReactDatePickerProps> {}
}



