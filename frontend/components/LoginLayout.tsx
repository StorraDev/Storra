import Image from 'next/image'

export default function LoginAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className='min-h-screen sm:flex sm:flex-col sm:justify-center sm:items-center lg:grid lg:grid-cols-2 lg:mt-0 md:flex md:flex-col-reverse md:min-h-auto md:mt-[2rem] md:gap-10'>
      <section className='bg-white p-8 flex flex-col justify-center md:w-full max-sm:m-auto max-sm:h-screen'>
        {children}
      </section>

      <section className='hidden md:flex md:flex-row md:gap-5 lg:flex-col items-center justify-center bg-blue text-white p-8 rounded-4xl my-auto lg:w-[95%] lg:h-[95vh] md:w-[90%] md:h-auto md:mx-auto md:mt-5'>
        <div className='flex flex-col justify-center items-center gap-5'>
          <h2 className='text-2xl md:text-4xl lg:text-4xl font-bold'>
            Welcome back to Storra
          </h2>
          <p className='text-lg lg:text-xl lg:text-center w-full lg:w-3/4'>
            Let&apos; s get back into learning and earning the fun way, Are you
            ready?
          </p>
        </div>
        <div className='relative lg:w-11/12 lg:h-9/12 md:w-full md:h-[320px] md:m-auto bg-dot-grid rounded-xl flex items-center justify-center mb-6'>
          <Image
            src='/images/student-illustration.png'
            alt='Student Illustration'
            width={320}
            height={320}
            className='w-52 h-auto relative z-10'
          />
        </div>
      </section>
    </main>
  )
}
