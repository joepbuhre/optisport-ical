/**
 * @param {{
    date: string;
    day: string;
    title: string;
    internalLocation: string;
    start: string;
    end: string;
    source: string;
    themeColor: string;
    url: string;
}} obj 
 */
return (obj) => {
    let dt = new Date(obj.start);
    return dt > new Date(dt).setHours(12);
};
