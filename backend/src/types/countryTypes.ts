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
}

export type { ICountry, ICountryRegistration, ICountryDocument };