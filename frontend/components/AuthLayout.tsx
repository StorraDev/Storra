import Image from 'next/image'
import { useState } from 'react'

export default function AuthLayout({
  children,
  userType
  
}: {
  children: React.ReactNode,
   userType: 'student' | 'parent' | 'teacher' | null;
}) {
  const [user] = useState<'student' | 'parent' | 'teacher'>('student')

  const lastStepMap = {
    student: 'Start learning and earning',
    parent: "Support and track ward's progress",
    teacher: 'Setup your classroom',
  }
  const imageMap = {
    student: '/images/student.svg',
    parent: '/images/parent.svg',
    teacher: '/images/teacher.svg',
  };
  const steps = [
    { number: 1, text: 'Create an account type' },
    { number: 2, text: 'Provide your details' },
    { number: 3, text: lastStepMap[user] || 'Get started' },
  ]

  return (
    <main className='min-h-screen sm:grid sm:grid-cols-1 lg:grid lg:grid-cols-2 md:flex md:flex-col-reverse'>
      <section className='bg-white p-8 flex flex-col justify-center lg:w-auto md:w-full sm:w-full'>
        {children}
      </section>

      <section className='hidden md:flex md:flex-row-reverse md:gap-5 lg:flex-col items-center justify-center bg-blue text-white p-8 rounded-4xl my-auto lg:w-[95%] lg:h-[100vh] md:w-[90%] md:h-[100%] md:mx-auto md:mt-5'>
        <div className='relative lg:w-11/12 lg:h-9/12 md:w-full md:h-[320px] md:m-auto bg-dot-grid rounded-xl flex items-center justify-center mb-6'>
              {userType === 'parent' && (
                    <Image
            src='/images/parent.svg'
            alt='parent Illustration'
               width={320}
                    height={320}
            className='w-52 h-auto relative z-10 md:w-[350px] md:h-[350px] '
          />
                    )}
          
      {userType === 'teacher' && (
                    <Image
            src='/images/teacher.svg'
            alt='teacher Illustration'
            width={320}
            height={320}
                      className='w-52 h-auto relative z-10 md:w-[350px] md:h-[350px] '
          />
                    )}
                        {userType === 'student' && (
                    <Image
            src='/images/student.svg'
            alt='Student Illustration'
            width={320}
            height={320}
                     className='w-52 h-auto relative z-10 md:w-[350px] md:h-[350px] '
          />
                    )}
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full'>
          {steps.map((step) => (
            <StepBox
              key={step.number}
              number={step.number}
              text={step.text}
              active={step.number === 1}
            />
          ))}
        </div>
      </section>
    </main>
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
