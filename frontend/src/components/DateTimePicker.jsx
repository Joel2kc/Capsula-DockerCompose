import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";

export default function DateTimePicker({ selected, onChange, minDate }) {
	return (
		<div className="w-full">
			<style>
				{`
					.no-caret {
						caret-color: transparent;
					}
				`}
			</style>
			<DatePicker
				selected={selected}
				onChange={onChange}
				showTimeSelect
				minDate={minDate}
				timeFormat="HH:mm"
				timeIntervals={5}
				dateFormat="MMMM d, yyyy h:mm aa"
				className="w-full bg-primary-surface/30 border border-primary-gold/20 rounded-xl p-4 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary-gold/40 transition-colors cursor-pointer select-none no-caret"
				placeholderText="Select unlock date and time"
				wrapperClassName="w-full block"
				onChangeRaw={(e) => e.preventDefault()}
				showPopperArrow={false}
			/>
		</div>
	);
}
