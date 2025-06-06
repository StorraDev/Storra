interface ICountry {
    name: string;
    password: string;
}

interface ICountryRegistration {
    name: string;
    email: string;
    password: string;
}

interface ICountryDocument extends ICountryRegistration {
    countryCode: string;
    registrationNumber: string;
    createdAt: Date;
    updatedAt: Date;
}

export type { ICountry, ICountryRegistration, ICountryDocument };