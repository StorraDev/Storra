import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen sm:grid sm:grid-cols-1 lg:grid lg:grid-cols-2 md:flex md:flex-col-reverse'>
      {/* Form content */}
      <div className='bg-white p-8 flex flex-col justify-center lg:w-auto md:w-full sm:w-full'>
        {children}
      </div>

      {/* Illustration and steps – hidden on small screens */}
      <div className='hidden md:flex md:flex-row-reverse md:gap-5 lg:flex-col items-center justify-center bg-blue text-white p-8 rounded-4xl my-auto lg:w-[95%] lg:h-[95vh] md:w-[90%] md:h-[100%] md:mx-auto md:mt-5'>
        {/* Dotted background wrapper */}
        <div className='relative lg:w-11/12 lg:h-9/12 md:w-full md:h-[320px] md:m-auto bg-dot-grid rounded-xl flex items-center justify-center mb-6'>
          <Image
            src='/images/student-illustration.png'
            alt='Student Illustration'
            width={320}
            height={320}
            className='w-52 h-auto relative z-10'
          />
        </div>

        {/* Steps */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full'>
          <StepBox number={1} text='Create an account type' active />
          <StepBox number={2} text='Provide your details' />
          <StepBox number={3} text='Start learning and earning' />
        </div>
      </div>
    </div>
  )
}

function StepBox({
  number,
  text,
  active = false,
}: {
  number: number
  text: string
  active?: boolean
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 h-[150px] flex flex-col justify-around gap-5 lg:col-span-1
        ${active ? 'bg-white text-black' : 'bg-blue-500 text-white'}
        ${number === 3 ? 'md:col-span-2' : 'md:col-span-1'}
      `}
    >
      <p className='font-semibold bg-orange rounded-full text-black text-sm w-6 h-6 flex justify-center items-center'>
        {number}
      </p>
      <p
        className={`text-base lg:text-lg ${
          number === 1 ? 'text-black' : 'text-white'
        }`}
      >
        {text}
      </p>
    </div>
  )
}
