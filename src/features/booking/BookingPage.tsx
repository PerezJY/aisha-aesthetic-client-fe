import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Sparkles,
} from 'lucide-react';

import Swal from "sweetalert2";
import { createBooking } from '../../api/appointments.api';
import { getServices } from '../../api/services.api';
import { getShopAreas } from '../../api/shopAreas.api';
import type { Service, ShopArea } from '../../types';
import { getCurrentUser } from '../../utils/auth';

// ==========================================
// TIME SLOTS
// ==========================================

const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

// ==========================================
// BOOKING COMPONENT
// ==========================================

function Booking() {
  // ==========================================
  // STATES
  // ==========================================

  const [selectedService, setSelectedService] =
    useState<number | null>(null);

  const [selectedDate, setSelectedDate] =
    useState<string>('');

  const [selectedTime, setSelectedTime] =
    useState<string>('');

  const [catalog, setCatalog] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState('');

  // ==========================================
  // SHOP AREAS
  // ==========================================

  const [shopAreas, setShopAreas] =
    useState<ShopArea[]>([]);

  const [selectedArea, setSelectedArea] =
    useState<string>('');

  const [isLoadingAreas, setIsLoadingAreas] =
    useState<boolean>(true);

  // ==========================================
  // SUBMITTING
  // ==========================================

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const services = catalog.filter((item) => (item.type || 'Service') === 'Service');
  const products = catalog.filter((item) => item.type === 'Product');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const getImageUrl = (image?: string | null) => {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    return `${apiBaseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  };

  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoadingServices(true);
        setServicesError('');
        const data = await getServices();
        const activeItems = Array.isArray(data) ? data : [];
        setCatalog(activeItems);
        setSelectedService((current) =>
          activeItems.some((item) => (item.type || 'Service') === 'Service' && item.id === current)
            ? current
            : null
        );
      } catch (error) {
        console.error('Failed to load services:', error);
        setCatalog([]);
        setSelectedService(null);
        setServicesError('There was a problem loading the available services. Please try again later.');
      } finally {
        setIsLoadingServices(false);
      }
    };

    void loadServices();
  }, []);

  // ==========================================
  // LOAD SHOP AREAS
  // ==========================================

  useEffect(() => {
    const loadShopAreas = async () => {
      try {
        const data = await getShopAreas();

        console.log(
          'Loaded shop areas:',
          data
        );

        const areas = Array.isArray(data) ? data : [];

        setShopAreas(areas);

        // Automatically select the first area
        if (areas.length > 0) {
          setSelectedArea(
            areas[0].name
          );
        } else {
          setSelectedArea('');
        }
      } catch (error) {
        console.error(
          'Failed to load shop areas:',
          error
        );

        setShopAreas([]);
        setSelectedArea('');
      } finally {
        setIsLoadingAreas(false);
      }
    };

    loadShopAreas();
  }, []);

  // ==========================================
  // SELECTED SERVICE
  // ==========================================

  const service = services.find(
    (item) => item.id === selectedService
  );

  // ==========================================
  // TODAY
  // ==========================================

  const today = new Date();

  const todayString =
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0');

  // ==========================================
  // HANDLE DATE
  // ==========================================

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const date = event.target.value;

    setSelectedDate(date);

    console.log(
      'Selected Date:',
      date
    );
  };

  // ==========================================
  // HANDLE TIME
  // ==========================================

  const handleTimeChange = (
    time: string
  ) => {
    setSelectedTime(time);

    console.log(
      'Selected Time:',
      time
    );
  };

  // ==========================================
  // HANDLE AREA
  // ==========================================

  const handleAreaChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const area = event.target.value;

    setSelectedArea(area);

    console.log(
      'Selected Area:',
      area
    );
  };

  const handleBooking = async () => {
  if (!service) {
    await Swal.fire({
      icon: 'warning',
      title: 'No Service Selected',
      text: 'Please select a service.',
      confirmButtonColor: '#d77a94',
    });
    return;
  }

  if (!selectedDate) {
    await Swal.fire({
      icon: 'warning',
      title: 'No Date Selected',
      text: 'Please select an appointment date.',
      confirmButtonColor: '#d77a94',
    });
    return;
  }

  if (!selectedTime) {
    await Swal.fire({
      icon: 'warning',
      title: 'No Time Selected',
      text: 'Please select an available time.',
      confirmButtonColor: '#d77a94',
    });
    return;
  }

  if (!selectedArea) {
    await Swal.fire({
      icon: 'warning',
      title: 'No Shop Area Selected',
      text: 'Please select a shop area.',
      confirmButtonColor: '#d77a94',
    });
    return;
  }

  // ==========================================
  // CURRENT USER
  // ==========================================

  const currentUser = getCurrentUser();

  if (!currentUser?.id) {
    await Swal.fire({
      icon: 'warning',
      title: 'Sign In Required',
      text: 'Please sign in before booking an appointment.',
      confirmButtonColor: '#d77a94',
    });
    return;
  }

  setIsSubmitting(true);

  try {
    await createBooking({
      customerId: currentUser.id,

      serviceId: service.id,

      serviceName: service.name,

      category: service.category,

      date: selectedDate,

      time: selectedTime,

      area: selectedArea,

      price: service.price,
    });

    await Swal.fire({
      icon: "success",
        title: "Appointment Booked!",
        footer: 'To schedule a follow-up, open Appointments → View Details → Schedule next session.',
      html: `
        <div style="text-align: left; line-height: 1.8;">
          <p><strong>Service:</strong> ${service.name}</p>
          <p><strong>Date:</strong> ${selectedDate}</p>
          <p><strong>Time:</strong> ${selectedTime}</p>
          <p><strong>Area:</strong> ${selectedArea}</p>
          <p><strong>Price:</strong> ₱${service.price.toLocaleString()}</p>
        </div>
      `,
      confirmButtonText: "Done",
      confirmButtonColor: "#d77a94",
    });

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong.';

    await Swal.fire({
      icon: 'error',
      title: 'Booking Failed',
      text: message,
      confirmButtonColor: '#d77a94',
    });

  } finally {
    setIsSubmitting(false);
  }
};
  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8 w-full min-w-0 overflow-x-hidden">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="mb-5 sm:mb-6">

        <div className="mb-2 flex items-center gap-2">

          <Sparkles
            size={18}
            className="shrink-0 text-[#c18c2d]"
          />

          <span className="truncate text-xs font-semibold uppercase tracking-[0.15em] text-[#c18c2d] sm:text-sm sm:tracking-[0.2em]">
            AishaEsthetics
          </span>

        </div>

        <h1 className="page-title">
          Book an Appointment
        </h1>

        <p className="page-subtitle">
          Choose your preferred beauty and wellness service, date,
          and available time.
        </p>

      </div>

      {/* ==========================================
          MAIN BOOKING LAYOUT
      ========================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          sm:gap-6
          xl:grid-cols-[minmax(0,1fr)_360px]
          xl:items-start
        "
      >

        {/* ==========================================
            LEFT CONTENT
        ========================================== */}

        <div className="min-w-0 space-y-5 sm:space-y-6">

          {/* ==========================================
              STEP 1 - SERVICE
          ========================================== */}

          <section className="pink-card">

            <div className="mb-5 flex items-center gap-3">

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#df7f98] text-sm font-bold text-white">
                1
              </span>

              <div className="min-w-0">

                <h2 className="font-bold text-[#4b343b]">
                  Choose a Service
                </h2>

                <p className="text-xs text-[#92737c]">
                  Select the treatment you want to book.
                </p>

              </div>

            </div>

            {/* ==========================================
                SERVICE CARDS
            ========================================== */}

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              "
            >

              {isLoadingServices && (
                <p className="col-span-full rounded-xl bg-white p-6 text-center text-sm text-[#92737c]">Loading available services...</p>
              )}

              {!isLoadingServices && servicesError && (
                <p className="col-span-full rounded-xl bg-white p-6 text-center text-sm text-red-600">{servicesError}</p>
              )}

              {!isLoadingServices && !servicesError && services.length === 0 && (
                <p className="col-span-full rounded-xl bg-white p-6 text-center text-sm text-[#92737c]">No active services are available for booking.</p>
              )}

              {!isLoadingServices && !servicesError && services.map((item) => {

                const active =
                  selectedService === item.id;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      setSelectedService(
                        item.id
                      )
                    }
                    className={`group relative min-w-0 overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
                      active
                        ? 'border-[#df7f98] bg-[#fff4f6] ring-2 ring-pink-100 shadow-md'
                        : 'border-pink-100 bg-white hover:-translate-y-1 hover:border-[#e8b4c1] hover:shadow-md'
                    }`}
                  >

                    {/* CHECK */}

                    {active && (
                      <div className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#df7f98] text-white shadow">

                        <Check
                          size={16}
                          strokeWidth={3}
                        />

                      </div>
                    )}

                    {/* IMAGE */}

                    <div
                      className="
                        relative
                        h-44
                        overflow-hidden
                        bg-[#fff4f6]
                        sm:h-40
                      "
                    >

                      {getImageUrl(item.image) ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#df7f98]"><Sparkles size={30} /></div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                      <div className="absolute bottom-3 left-3 right-3">

                        <span className="inline-block max-w-full truncate rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#b14f70] shadow-sm backdrop-blur-sm">
                          {item.category}
                        </span>

                      </div>

                    </div>

                    {/* CONTENT */}

                    <div className="p-4">

                      <h3 className="pr-8 font-bold text-[#4b343b]">
                        {item.name}
                      </h3>

                      <p className="mt-2 min-h-[40px] text-xs leading-5 text-[#92737c]">
                        {item.description}
                      </p>

                      <div
                        className="
                          mt-4
                          flex
                          flex-col
                          gap-2
                          border-t
                          border-pink-100
                          pt-3
                          min-[420px]:flex-row
                          min-[420px]:items-center
                          min-[420px]:justify-between
                        "
                      >

                        <span className="text-base font-bold text-[#c18c2d]">
                          ₱{item.price.toLocaleString()}
                        </span>

                        <span className="flex items-center gap-1 text-xs font-medium text-[#92737c]">

                          <Clock3 size={13} />

                          {item.duration}

                        </span>

                      </div>

                    </div>

                  </button>
                );
              })}

            </div>

            {!isLoadingServices && products.length > 0 && (
              <div className="mt-8 border-t border-pink-100 pt-6">
                <h3 className="mb-1 font-bold text-[#4b343b]">Products</h3>
                <p className="mb-4 text-xs text-[#92737c]">Available products are shown for reference and cannot be booked as appointments.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {products.map((item) => (
                    <div key={item.id} className="flex gap-4 rounded-2xl border border-pink-100 bg-white p-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#fff4f6]">
                        {getImageUrl(item.image) ? <img src={getImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#4b343b]">{item.name}</p>
                        <p className="mt-1 text-xs text-[#92737c]">{item.category}</p>
                        <p className="mt-2 font-bold text-[#c18c2d]">₱{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>

          {/* ==========================================
              STEP 2 - DATE & TIME
          ========================================== */}

          <section className="pink-card">

            <div className="mb-5 flex items-center gap-3">

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#df7f98] text-sm font-bold text-white">
                2
              </span>

              <div className="min-w-0">

                <h2 className="font-bold text-[#4b343b]">
                  Date & Time
                </h2>

                <p className="text-xs text-[#92737c]">
                  Choose your preferred schedule.
                </p>

              </div>

            </div>

            {/* ==========================================
                DATE + SHOP AREA
            ========================================== */}

            <div
              className="
                grid
                grid-cols-1
                gap-5
                md:grid-cols-2
              "
            >

              {/* ========================================
                  DATE
              ======================================== */}

              <div className="min-w-0">

                <label
                  htmlFor="appointment-date"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5d444c]"
                >

                  <CalendarDays
                    size={16}
                    className="shrink-0 text-[#c18c2d]"
                  />

                  Appointment Date

                </label>

                <input
                  id="appointment-date"
                  type="date"
                  value={selectedDate}
                  min={todayString}
                  onChange={handleDateChange}
                  className="
                    input-field
                    w-full
                    min-w-0
                    cursor-pointer
                  "
                />

              </div>

              {/* ========================================
                  SHOP AREA
              ======================================== */}

              <div className="min-w-0">

                <label
                  htmlFor="shop-area"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5d444c]"
                >

                  <MapPin
                    size={16}
                    className="shrink-0 text-[#c18c2d]"
                  />

                  Shop Area

                </label>

                <select
                  id="shop-area"
                  value={selectedArea}
                  onChange={handleAreaChange}
                  disabled={
                    isLoadingAreas ||
                    shopAreas.length === 0
                  }
                  className="
                    input-field
                    w-full
                    min-w-0
                    cursor-pointer
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  {isLoadingAreas ? (

                    <option value="">
                      Loading shop areas...
                    </option>

                  ) : shopAreas.length === 0 ? (

                    <option value="">
                      No shop area available
                    </option>

                  ) : (

                    shopAreas.map((area) => (

                      <option
                        key={area.id}
                        value={area.name}
                      >
                        {area.name}
                      </option>

                    ))

                  )}

                </select>

              </div>

            </div>

            {/* ==========================================
                AVAILABLE TIME
            ========================================== */}

            <div className="mt-6">

              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5d444c]">

                <Clock3
                  size={16}
                  className="shrink-0 text-[#c18c2d]"
                />

                Available Time

              </label>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-2.5
                  min-[420px]:gap-3
                  sm:grid-cols-3
                  lg:grid-cols-4
                "
              >

                {timeSlots.map((time) => {

                  const active =
                    selectedTime === time;

                  return (
                    <button
                      type="button"
                      key={time}
                      onClick={() =>
                        handleTimeChange(
                          time
                        )
                      }
                      className={`min-w-0 rounded-xl border px-2 py-3 text-xs font-medium transition sm:px-4 sm:text-sm ${
                        active
                          ? 'border-[#df7f98] bg-[#df7f98] text-white shadow-sm'
                          : 'border-pink-100 bg-[#fffafb] text-[#73555f] hover:border-[#e2a0b1] hover:bg-[#fff4f6]'
                      }`}
                    >
                      {time}
                    </button>
                  );

                })}

              </div>

            </div>

          </section>

        </div>

        {/* ==========================================
            BOOKING SUMMARY
        ========================================== */}

        <aside
          className="
            order-last
            w-full
            min-w-0
            overflow-hidden
            rounded-3xl
            border
            border-pink-100
            bg-white
            shadow-sm
            xl:order-none
            xl:sticky
            xl:top-24
            xl:max-h-[calc(100vh-7rem)]
          "
        >

          {/* ==========================================
              SUMMARY HEADER
          ========================================== */}

          <div
            className="
              border-b
              border-pink-100
              bg-[#fff4f6]
              p-4
              sm:p-6
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#df7f98]
                  text-white
                  sm:h-11
                  sm:w-11
                "
              >

                <CalendarDays size={20} />

              </div>

              <div className="min-w-0">

                <h2 className="text-base font-bold text-[#4b343b] sm:text-lg">
                  Booking Summary
                </h2>

                <p className="text-xs text-[#92737c]">
                  Review your appointment.
                </p>

              </div>

            </div>

          </div>

          {/* ==========================================
              SUMMARY CONTENT
          ========================================== */}

          <div
            className="
              p-4
              sm:p-6
              xl:max-h-[calc(100vh-13rem)]
              xl:overflow-y-auto
              xl:overscroll-contain
              [scrollbar-color:#e2a0b1_#fff4f6]
              [scrollbar-width:thin]
            "
          >

            {/* ==========================================
                SELECTED SERVICE
            ========================================== */}

            {service && (

              <div className="mb-5 overflow-hidden rounded-2xl border border-pink-100 bg-[#fffafb]">

                {getImageUrl(service.image) ? (
                  <img
                    src={getImageUrl(service.image)}
                    alt={service.name}
                    className="h-36 w-full object-cover sm:h-40"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-[#fff4f6] text-[#df7f98] sm:h-40"><Sparkles size={34} /></div>
                )}

                <div className="p-4">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#b14f70]">
                    {service.category}
                  </p>

                  <h3 className="mt-1 break-words font-bold text-[#4b343b]">
                    {service.name}
                  </h3>

                  <p className="mt-1 text-xs text-[#92737c]">
                    {service.duration}
                  </p>

                </div>

              </div>

            )}

            {/* ==========================================
                NO SERVICE
            ========================================== */}

            {!service && (

              <div
                className="
                  mb-5
                  flex
                  min-h-[130px]
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-pink-200
                  bg-[#fffafb]
                  px-4
                  py-5
                  text-center
                "
              >

                <Sparkles
                  size={24}
                  className="mb-2 text-[#df7f98]"
                />

                <p className="text-sm font-medium text-[#73555f]">
                  No service selected
                </p>

                <p className="mt-1 text-xs leading-5 text-[#a1878e]">
                  Select a service to see your appointment details.
                </p>

              </div>

            )}

            {/* ==========================================
                APPOINTMENT DETAILS
            ========================================== */}

            <div className="space-y-4">

              {/* SERVICE */}

              <div className="border-b border-pink-100 pb-4">

                <p className="text-xs text-[#92737c]">
                  Service
                </p>

                <p className="mt-1 break-words font-semibold text-[#4b343b]">
                  {service?.name ||
                    'No service selected'}
                </p>

              </div>

              {/* DATE */}

              <div className="border-b border-pink-100 pb-4">

                <p className="text-xs text-[#92737c]">
                  Date
                </p>

                <p className="mt-1 font-semibold text-[#4b343b]">
                  {selectedDate
                    ? selectedDate
                    : 'Select a date'}
                </p>

              </div>

              {/* TIME */}

              <div className="border-b border-pink-100 pb-4">

                <p className="text-xs text-[#92737c]">
                  Time
                </p>

                <p className="mt-1 font-semibold text-[#4b343b]">
                  {selectedTime
                    ? selectedTime
                    : 'Select a time'}
                </p>

              </div>

              {/* SHOP AREA */}

              <div className="border-b border-pink-100 pb-4">

                <p className="text-xs text-[#92737c]">
                  Shop Area
                </p>

                <p className="mt-1 break-words font-semibold text-[#4b343b]">
                  {selectedArea ||
                    'No shop area available'}
                </p>

              </div>

              {/* PRICE */}

              <div>

                <p className="text-xs text-[#92737c]">
                  Total Price
                </p>

                <p className="mt-1 text-2xl font-bold text-[#c18c2d] sm:text-3xl">
                  ₱
                  {service
                    ? service.price.toLocaleString()
                    : '0'}
                </p>

              </div>

            </div>

            {/* ==========================================
                CONFIRM BOOKING
            ========================================== */}

            <button
              type="button"
              onClick={handleBooking}
              disabled={
                isSubmitting ||
                isLoadingAreas ||
                shopAreas.length === 0
              }
              className="
                primary-btn
                mt-7
                w-full
                disabled:cursor-not-allowed
                disabled:opacity-70
              "
            >

              {isSubmitting
                ? 'Booking...'
                : 'Confirm Booking'}

            </button>

            {/* ==========================================
                REMINDER
            ========================================== */}

            <p className="mt-4 pb-2 text-center text-xs leading-5 text-[#a1878e]">
              Please arrive at least 15 minutes before your appointment.
            </p>

          </div>

        </aside>

      </div>

    </div>
  );
}

export default Booking;
